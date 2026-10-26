<?php

declare(strict_types=1);

namespace App\Command;

use App\Match\RankedMatchSync;
use App\Riot\RiotApiClient;
use App\Storage\MatchStore;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:ranked:sync', description: 'Enregistre en base les games classées Solo/Duo d\'un joueur')]
final class SyncRankedMatchesCommand extends Command
{
    public function __construct(
        private readonly RiotApiClient $riot,
        private readonly RankedMatchSync $sync,
        private readonly MatchStore $store,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('gameName', InputArgument::REQUIRED, 'Nom Riot, par exemple KGB')
            ->addArgument('tagLine', InputArgument::REQUIRED, 'Tag Riot, sans le #')
            ->addOption('since', null, InputOption::VALUE_REQUIRED, 'Date de début (AAAA-MM-JJ, heure de Paris). Par défaut : la dernière game déjà en base.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $account = $this->riot->getAccountByRiotId($input->getArgument('gameName'), $input->getArgument('tagLine'));
        $puuid = $account['puuid'];

        $since = $this->since($input->getOption('since'), $puuid);
        if (null === $since) {
            $io->error('Aucune game en base pour ce joueur : précise la date de départ avec --since=AAAA-MM-JJ.');

            return Command::INVALID;
        }

        $io->text(\sprintf('Games Solo/Duo de %s#%s depuis le %s…', $account['gameName'], $account['tagLine'], $since->format('d/m/Y H:i')));
        $report = $this->sync->sync($puuid, $since, static fn (string $matchId) => $io->text('  + '.$matchId));

        $io->success(\sprintf(
            '%d games trouvées, %d déjà en base, %d ajoutées. Total en base pour ce joueur : %d.',
            $report['found'],
            $report['alreadyStored'],
            $report['saved'],
            $this->store->countForPlayer($puuid),
        ));

        return Command::SUCCESS;
    }

    private function since(?string $option, string $puuid): ?\DateTimeImmutable
    {
        $paris = new \DateTimeZone('Europe/Paris');
        if (null !== $option) {
            $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $option, $paris);
            if (false === $date) {
                throw new \InvalidArgumentException(\sprintf('Date invalide « %s », format attendu : AAAA-MM-JJ.', $option));
            }

            return $date;
        }

        $latest = $this->store->latestGameStart($puuid);

        return null === $latest ? null : (new \DateTimeImmutable('@'.intdiv($latest, 1000)))->setTimezone($paris);
    }
}
