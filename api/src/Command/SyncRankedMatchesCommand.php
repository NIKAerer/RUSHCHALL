<?php

declare(strict_types=1);

namespace App\Command;

use App\Match\RankedMatchSync;
use App\Match\SyncWindow;
use App\Player\TrackedPlayer;
use App\Storage\MatchStore;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:ranked:sync', description: 'Enregistre en base les games classées Solo/Duo du joueur suivi')]
final class SyncRankedMatchesCommand extends Command
{
    public function __construct(
        private readonly TrackedPlayer $player,
        private readonly RankedMatchSync $sync,
        private readonly SyncWindow $window,
        private readonly MatchStore $store,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('since', null, InputOption::VALUE_REQUIRED, 'Date de début (AAAA-MM-JJ, heure de Paris). Par défaut : la dernière game en base, sinon SYNC_SINCE.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $account = $this->player->account();
        $option = $input->getOption('since');
        $since = null !== $option ? SyncWindow::parseDate($option) : $this->window->startFor($account['puuid']);

        $io->text(\sprintf('Games Solo/Duo de %s#%s depuis le %s…', $account['gameName'], $account['tagLine'], $since->format('d/m/Y H:i')));
        $report = $this->sync->sync($account['puuid'], $since, onSaved: static fn (string $matchId) => $io->text('  + '.$matchId));

        $io->success(\sprintf(
            '%d games trouvées, %d déjà en base, %d ajoutées. Total en base : %d.',
            $report['found'],
            $report['alreadyStored'],
            $report['saved'],
            $this->store->countForPlayer($account['puuid']),
        ));

        return Command::SUCCESS;
    }
}
